# API Testing Guide

## Health Check APIs
Kiểm tra tất cả services đang chạy:

```bash
# User Service
curl http://localhost:3001/health

# Product Service  
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health

# Payment Service
curl http://localhost:3004/health
```

## Complete API Flow Test

### 1. Register User
```bash
curl -X POST http://localhost:3001/users/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"
```

### 2. Login User
```bash
curl -X POST http://localhost:3001/users/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

**Save the token from response!**

### 3. Get Products
```bash
curl http://localhost:3002/products
```

### 4. Create Order (replace YOUR_TOKEN)
```bash
curl -X POST http://localhost:3003/orders ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"items\":[{\"productId\":\"PRODUCT_ID_FROM_STEP_3\",\"quantity\":1}],\"shippingAddress\":{\"street\":\"123 Main St\",\"city\":\"Anytown\",\"state\":\"CA\",\"zipCode\":\"12345\",\"country\":\"USA\"}}"
```

### 5. Process Payment (replace YOUR_TOKEN and ORDER_ID)
```bash
curl -X POST http://localhost:3004/payments ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"orderId\":\"ORDER_ID_FROM_STEP_4\",\"amount\":199.99,\"currency\":\"USD\",\"paymentMethod\":\"credit_card\"}"
```

## Expected Responses

### Health Check Response:
```json
{
  "service": "user-service",
  "status": "healthy", 
  "timestamp": "2025-09-28T..."
}
```

### Login Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "uuid-here",
  "email": "test@example.com"
}
```

### Products Response:
```json
{
  "products": [
    {
      "id": "uuid-here",
      "name": "Wireless Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "price": 199.99,
      "category": "Electronics",
      "inventory": 50
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

## Common Issues & Solutions

### Service Not Found (ECONNREFUSED)
- Make sure the service is running
- Check the correct port (3001-3004)
- Verify no firewall blocking

### MongoDB Connection Error
- Start MongoDB: `docker run -d --name mongodb -p 27017:27017 mongo:6`
- Check connection string in .env files

### RabbitMQ Connection Error  
- Start RabbitMQ: `docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management`
- Access management UI: http://localhost:15672 (guest/guest)

### JWT Token Invalid
- Make sure to copy the full token from login response
- Include "Bearer " prefix in Authorization header
- Check token hasn't expired (24h default)

### Product Not Found in Order
- Use actual product ID from GET /products response
- Verify product has sufficient inventory

## Using Postman/Insomnia
1. Import the above curl commands
2. Create environment variables for:
   - BASE_URL_USER: http://localhost:3001
   - BASE_URL_PRODUCT: http://localhost:3002  
   - BASE_URL_ORDER: http://localhost:3003
   - BASE_URL_PAYMENT: http://localhost:3004
   - AUTH_TOKEN: (set after login)

## Troubleshooting Commands

Check if services are running:
```bash
netstat -an | findstr "3001 3002 3003 3004"
```

Check Docker containers:
```bash
docker ps
```

View service logs:
```bash
# In the terminal where service is running
# Look for any error messages
```