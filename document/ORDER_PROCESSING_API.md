# Order Processing Flow - API Documentation

## Giới thiệu
Tài liệu này mô tả chi tiết luồng xử lý đơn hàng (Place Order Processing) cho hệ thống FoodFast Delivery, bao gồm các bước từ khi khách hàng duyệt menu, đặt hàng, đến thanh toán qua VNPAY.

## Luồng nghiệp vụ (Business Flow)

### Use Case: Place Order Processing

**Actor:** Customer  
**Maturity:** Focused  
**Summary:** Khách hàng duyệt menu, chọn món ăn, đặt đơn hàng và thanh toán trực tuyến thông qua cổng VNPAY.

---

## API Endpoints

### 1. Xem danh sách nhà hàng
**Endpoint:** `GET /api/restaurants`  
**Service:** Product Service  
**Description:** Hiển thị danh sách nhà hàng có sẵn

**Request:**
```http
GET /api/restaurants HTTP/1.1
Host: localhost:3003
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "restaurant_id_1",
      "name": "Pizza Hut",
      "address": "123 Main St",
      "image_url": "https://...",
      "rating": 4.5
    }
  ]
}
```

---

### 2. Xem menu nhà hàng
**Endpoint:** `GET /api/dishes?restaurant_id={restaurant_id}`  
**Service:** Product Service  
**Description:** Hiển thị danh sách món ăn của nhà hàng

**Request:**
```http
GET /api/dishes?restaurant_id=restaurant_id_1 HTTP/1.1
Host: localhost:3003
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "dish_id_1",
      "name": "Margherita Pizza",
      "price": 150000,
      "image_url": "https://...",
      "description": "Classic pizza with tomato and cheese",
      "restaurant_id": "restaurant_id_1"
    }
  ]
}
```

---

### 3. Thêm món vào giỏ hàng
**Endpoint:** `POST /api/orders/cart/items`  
**Service:** Order Service  
**Description:** Thêm món ăn vào giỏ hàng (Step 3)

**Request:**
```http
POST /api/orders/cart/items HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurant_id": "restaurant_id_1",
  "productId": "dish_id_1",
  "quantity": 2,
  "notes": "Extra cheese"
}
```

**Response:**
```json
{
  "_id": "cart_order_id",
  "customer_id": "user_id",
  "restaurant_id": "restaurant_id_1",
  "status": "cart",
  "items": [
    {
      "_id": "item_id_1",
      "productId": "dish_id_1",
      "name": "Margherita Pizza",
      "price": 150000,
      "quantity": 2,
      "image": "https://...",
      "notes": "Extra cheese"
    }
  ],
  "total_amount": 300000
}
```

**Exception E1:** Nếu chưa đăng nhập, hệ thống trả về:
```json
{
  "success": false,
  "message": "Authentication required",
  "statusCode": 401
}
```

---

### 4. Xem giỏ hàng
**Endpoint:** `GET /api/orders/cart?restaurant_id={restaurant_id}`  
**Service:** Order Service  
**Description:** Hiển thị thông tin giỏ hàng và tổng tiền (Step 5)

**Request:**
```http
GET /api/orders/cart?restaurant_id=restaurant_id_1 HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
```

**Response:**
```json
{
  "_id": "cart_order_id",
  "customer_id": "user_id",
  "restaurant_id": "restaurant_id_1",
  "status": "cart",
  "items": [
    {
      "_id": "item_id_1",
      "productId": "dish_id_1",
      "name": "Margherita Pizza",
      "price": 150000,
      "quantity": 2,
      "notes": "Extra cheese"
    }
  ],
  "total_amount": 300000,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z"
}
```

---

### 5. Cập nhật món trong giỏ hàng (Alternative A2)
**Endpoint:** `PATCH /api/orders/cart/items/{itemId}`  
**Service:** Order Service  
**Description:** Cập nhật số lượng hoặc ghi chú của món ăn

**Request:**
```http
PATCH /api/orders/cart/items/item_id_1 HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurant_id": "restaurant_id_1",
  "quantity": 3,
  "notes": "Extra cheese and olives"
}
```

**Response:**
```json
{
  "_id": "cart_order_id",
  "items": [
    {
      "_id": "item_id_1",
      "quantity": 3,
      "notes": "Extra cheese and olives"
    }
  ],
  "total_amount": 450000
}
```

---

### 6. Xóa món khỏi giỏ hàng (Alternative A2)
**Endpoint:** `DELETE /api/orders/cart/items/{itemId}`  
**Service:** Order Service  
**Description:** Xóa món ăn khỏi giỏ hàng

**Request:**
```http
DELETE /api/orders/cart/items/item_id_1?restaurant_id=restaurant_id_1 HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
```

**Response:**
```json
{
  "_id": "cart_order_id",
  "items": [],
  "total_amount": 0
}
```

---

### 7. Đặt hàng (Place Order)
**Endpoint:** `POST /api/orders/place`  
**Service:** Order Service  
**Description:** Chuyển giỏ hàng thành đơn hàng và tạo payment URL (Step 9-10)

**Request:**
```http
POST /api/orders/place HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurant_id": "restaurant_id_1",
  "long_address": "123 Nguyen Trai, District 1, Ho Chi Minh City",
  "payment_method": "vnpay"
}
```

**Response (VNPAY Payment):**
```json
{
  "success": true,
  "order": {
    "_id": "order_id_1",
    "customer_id": "user_id",
    "restaurant_id": "restaurant_id_1",
    "status": "payment_pending",
    "payment_status": "pending",
    "payment_method": "vnpay",
    "items": [...],
    "total_amount": 300000,
    "long_address": "123 Nguyen Trai, District 1, Ho Chi Minh City",
    "submitted_at": "2024-01-15T10:40:00.000Z"
  },
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=30000000&...",
  "message": "Redirect to payment gateway"
}
```

**Response (COD Payment):**
```json
{
  "success": true,
  "order": {
    "_id": "order_id_1",
    "status": "confirmed",
    "payment_status": "unpaid",
    "payment_method": "cod"
  },
  "paymentUrl": null,
  "message": "Order placed successfully"
}
```

---

### 8. Thanh toán VNPAY
**Endpoint:** `POST /api/payments/vnpay/create`  
**Service:** Payment Service  
**Description:** Tạo URL thanh toán VNPAY (Step 11)

**Request:**
```http
POST /api/payments/vnpay/create HTTP/1.1
Host: localhost:3004
Content-Type: application/json

{
  "orderId": "order_id_1",
  "amount": 300000,
  "orderInfo": "Thanh toan don hang order_id_1",
  "returnUrl": "http://localhost:5001/order/payment-result"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=30000000&vnp_Command=pay&...",
  "orderId": "order_id_1"
}
```

**Flow:**
1. Customer được redirect đến `paymentUrl`
2. Customer thực hiện thanh toán trên VNPAY
3. VNPAY callback về `GET /api/payments/vnpay/callback`

---

### 9. VNPAY Callback
**Endpoint:** `GET /api/payments/vnpay/callback`  
**Service:** Payment Service  
**Description:** Nhận kết quả thanh toán từ VNPAY và cập nhật trạng thái đơn hàng (Step 12)

**Request (VNPAY sends):**
```http
GET /api/payments/vnpay/callback?vnp_Amount=30000000&vnp_ResponseCode=00&vnp_TxnRef=order_id_1&vnp_TransactionNo=123456&vnp_SecureHash=... HTTP/1.1
Host: localhost:3004
```

**Processing:**
- Verify signature
- Update order status via Order Service
- Redirect customer to frontend

**Success Response (Redirect):**
```
HTTP/1.1 302 Found
Location: http://localhost:5001/order/payment-success?orderId=order_id_1
```

**Failed Response (Redirect):**
```
HTTP/1.1 302 Found
Location: http://localhost:5001/order/payment-failed?orderId=order_id_1
```

---

### 10. Hủy đơn hàng (Alternative A1)
**Endpoint:** `POST /api/orders/{orderId}/cancel`  
**Service:** Order Service  
**Description:** Hủy đơn hàng trước khi thanh toán

**Request:**
```http
POST /api/orders/order_id_1/cancel HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
Content-Type: application/json

{
  "cancellation_reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "order_id_1",
    "status": "cancelled",
    "cancellation_reason": "Changed my mind",
    "cancelled_at": "2024-01-15T10:45:00.000Z"
  }
}
```

**Error Response (Cannot Cancel):**
```json
{
  "message": "Cannot cancel order with status: confirmed"
}
```

---

### 11. Theo dõi trạng thái đơn hàng
**Endpoint:** `GET /api/orders/{orderId}/status`  
**Service:** Order Service  
**Description:** Xem trạng thái đơn hàng real-time (Step 13)

**Request:**
```http
GET /api/orders/order_id_1/status HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
```

**Response:**
```json
{
  "orderId": "order_id_1",
  "status": "confirmed",
  "paymentStatus": "paid",
  "totalAmount": 300000,
  "timestamps": {
    "created": "2024-01-15T10:30:00.000Z",
    "submitted": "2024-01-15T10:40:00.000Z",
    "paid": "2024-01-15T10:42:00.000Z",
    "completed": null,
    "cancelled": null
  }
}
```

---

### 12. Xem chi tiết đơn hàng
**Endpoint:** `GET /api/orders/{orderId}`  
**Service:** Order Service  
**Description:** Xem thông tin chi tiết đơn hàng

**Request:**
```http
GET /api/orders/order_id_1 HTTP/1.1
Host: localhost:3002
Authorization: Bearer {token}
```

**Response:**
```json
{
  "_id": "order_id_1",
  "customer_id": "user_id",
  "restaurant_id": "restaurant_id_1",
  "status": "confirmed",
  "payment_status": "paid",
  "payment_method": "vnpay",
  "items": [
    {
      "_id": "item_id_1",
      "productId": "dish_id_1",
      "name": "Margherita Pizza",
      "price": 150000,
      "quantity": 2,
      "image": "https://...",
      "notes": "Extra cheese"
    }
  ],
  "total_amount": 300000,
  "long_address": "123 Nguyen Trai, District 1, Ho Chi Minh City",
  "created_at": "2024-01-15T10:30:00.000Z",
  "submitted_at": "2024-01-15T10:40:00.000Z",
  "paid_at": "2024-01-15T10:42:00.000Z"
}
```

---

## Order Status Flow

```
cart → payment_pending → confirmed → preparing → ready_for_pickup → delivering → completed
  ↓           ↓
expired   cancelled
            ↓
    payment_failed
```

### Order Statuses:
- **cart**: Giỏ hàng đang active
- **payment_pending**: Đơn hàng đã đặt, đang chờ thanh toán
- **payment_failed**: Thanh toán thất bại
- **confirmed**: Đơn hàng đã được xác nhận, chuyển đến nhà hàng
- **preparing**: Nhà hàng đang chuẩn bị
- **ready_for_pickup**: Sẵn sàng để giao
- **delivering**: Đang giao hàng
- **completed**: Hoàn thành
- **cancelled**: Đã hủy
- **expired**: Giỏ hàng hết hạn

### Payment Statuses:
- **unpaid**: Chưa thanh toán (COD)
- **pending**: Đang chờ thanh toán
- **paid**: Đã thanh toán
- **refunded**: Đã hoàn tiền

---

## Error Handling

### Common Error Responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required",
  "statusCode": 401
}
```

**400 Bad Request:**
```json
{
  "message": "restaurant_id and productId are required"
}
```

**404 Not Found:**
```json
{
  "message": "Order not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Failed to create payment. Please try again."
}
```

---

## Environment Variables

### Order Service (.env)
```bash
PORT=3002
MONGODB_URI=mongodb://localhost:27017/order-service
PRODUCT_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
FRONTEND_URL=http://localhost:5001
JWT_SECRET=your_jwt_secret
```

### Payment Service (.env)
```bash
PORT=3004
MONGODB_URI=mongodb://localhost:27017/payment-service
ORDER_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:5001

# VNPAY Configuration
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=http://localhost:3004/api/payments/vnpay/callback
```

---

## Testing with Postman

### 1. Đăng nhập để lấy token
```bash
POST http://localhost:3001/api/auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}
```

### 2. Test Order Flow
```bash
# Step 1: Thêm món vào giỏ
POST http://localhost:3002/api/orders/cart/items
Authorization: Bearer {token}
{
  "restaurant_id": "restaurant_id_1",
  "productId": "dish_id_1",
  "quantity": 2
}

# Step 2: Xem giỏ hàng
GET http://localhost:3002/api/orders/cart?restaurant_id=restaurant_id_1
Authorization: Bearer {token}

# Step 3: Đặt hàng
POST http://localhost:3002/api/orders/place
Authorization: Bearer {token}
{
  "restaurant_id": "restaurant_id_1",
  "long_address": "123 Test Street",
  "payment_method": "vnpay"
}

# Step 4: Theo dõi trạng thái
GET http://localhost:3002/api/orders/{orderId}/status
Authorization: Bearer {token}
```

---

## VNPAY Sandbox Testing

### Test Cards (Sandbox):
- **Card Number:** 9704198526191432198
- **Card Holder:** NGUYEN VAN A
- **Issue Date:** 07/15
- **OTP:** 123456

### Response Codes:
- **00**: Giao dịch thành công
- **07**: Trừ tiền thành công, giao dịch bị nghi ngờ
- **09**: Giao dịch không thành công do thẻ chưa đăng ký dịch vụ
- **10**: Giao dịch không thành công do xác thực thông tin thẻ sai quá số lần
- **11**: Giao dịch không thành công do hết hạn chờ thanh toán
- **24**: Giao dịch không thành công do khách hàng hủy

---

## Integration Notes

### Frontend Integration:
1. User thêm món vào giỏ hàng
2. User xem và chỉnh sửa giỏ hàng
3. User nhấn "Đặt hàng", nhập địa chỉ và chọn phương thức thanh toán
4. Frontend gọi `POST /api/orders/place`
5. Nếu VNPAY: Frontend redirect user đến `paymentUrl`
6. Sau khi thanh toán, VNPAY callback về backend
7. Backend redirect về frontend với kết quả
8. Frontend hiển thị kết quả và trạng thái đơn hàng

### Backend Flow:
1. Order Service nhận request đặt hàng
2. Order Service cập nhật order status = payment_pending
3. Order Service gọi Payment Service để tạo VNPAY URL
4. Payment Service trả về payment URL
5. Order Service trả về cho Frontend
6. VNPAY callback về Payment Service
7. Payment Service verify signature và cập nhật Order Service
8. Order Service cập nhật status = confirmed
9. Order chuyển đến Restaurant để chuẩn bị

---

## Security Considerations

1. **Authentication**: Tất cả endpoints yêu cầu JWT token
2. **Authorization**: Chỉ customer có thể xem/chỉnh sửa đơn hàng của mình
3. **VNPAY Signature**: Verify secure hash để đảm bảo tính toàn vẹn
4. **HTTPS**: Production phải sử dụng HTTPS cho tất cả requests
5. **Rate Limiting**: Implement rate limiting để tránh abuse

---

## Next Steps / Extension Points

### EP1: Áp dụng mã khuyến mãi
- Thêm field `promotion_code` vào order
- API endpoint để validate và apply promotion
- Recalculate total với discount

### EP2: Hệ thống đánh giá
- API endpoint để customer đánh giá đơn hàng sau khi completed
- Rating cho món ăn và nhà hàng
- Review text và images

---

## Support

Để biết thêm thông tin về:
- Product Service API: Xem `services/product-service/README.md`
- User Service API: Xem `services/user-service/README.md`
- Payment Service API: Xem `services/payment-service/README.md`

## Version History
- **v1.0** - Initial implementation with VNPAY integration
- **Date**: November 18, 2025
