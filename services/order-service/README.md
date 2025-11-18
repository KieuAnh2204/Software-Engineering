Order Service

Overview
- Express + MongoDB (Mongoose)
- JWT auth (customer-facing routes require auth)
- HTTP inter-service via product-service and payment-service (with simple retries)
- Enforces one-order-per-restaurant and status transitions

Environment
- `MONGODB_URI` connection string
- `JWT_SECRET` used to verify tokens from user-service
- `PRODUCT_SERVICE_URL`, `PAYMENT_SERVICE_URL`
- `VNPAY_WEBHOOK_SECRET` for webhook signature verification

Run
- Dev: `npm run dev`
- Test: `npm test`

API
- POST `/api/orders` Create order (auth)
- GET `/api/orders/:id` Get order (auth, owner/restaurant/admin)
- GET `/api/orders` List with filters (auth)
- POST `/api/orders/:id/pay` Create VNPay intent
- POST `/api/orders/payment/webhook/vnpay` Payment callback (signed)
- POST `/api/orders/:id/restaurant-confirm` Processing → Delivering (restaurant)
- POST `/api/orders/:id/complete` Delivering → Completed
- POST `/api/orders/:id/cancel` Cancel with reason
- GET `/health` Health check

Notes
- Order IDs and related IDs are strings, snake_case fields preserved
- Product.category is a free-text snapshot in order items
- Payment refunds are stubbed for future implementation

