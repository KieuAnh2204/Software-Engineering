# Microservices Architecture with RabbitMQ

This project implements a complete microservices architecture with 4 services that communicate with each other using RabbitMQ for event-driven messaging and REST APIs for synchronous communication.

## Services Overview

### 1. User Service (Port 3001)
- **Purpose**: User management, authentication, and authorization
- **Features**:
  - User registration and login
  - JWT token generation and validation
  - User profile management
  - Password hashing with bcrypt

### 2. Product Service (Port 3002)
- **Purpose**: Product catalog and inventory management
- **Features**:
  - Product CRUD operations
  - Inventory tracking
  - Category management
  - Product availability checking

### 3. Order Service (Port 3003)
- **Purpose**: Order processing and management
- **Features**:
  - Order creation and management
  - Inventory reservation
  - Order status tracking
  - Integration with User and Product services

### 4. Payment Service (Port 3004)
- **Purpose**: Payment processing and transaction management
- **Features**:
  - Multiple payment methods (Credit Card, PayPal, Bank Transfer)
  - Payment status tracking
  - Refund processing
  - Mock payment gateway integration

## Architecture Features

### Event-Driven Communication
- **RabbitMQ**: Message broker for asynchronous communication
- **Events**: User created/updated, Product created/updated, Order created/updated, Payment completed/failed
- **Exchanges**: Topic exchanges for routing messages
- **Queues**: Durable queues for reliable message delivery

### Synchronous Communication
- **REST APIs**: Direct HTTP calls between services
- **Authentication**: JWT token validation across services
- **Service Discovery**: Environment-based service URLs

### Data Storage
- **In-Memory**: Current implementation uses in-memory storage
- **Database Ready**: Structured for easy database integration
- **PostgreSQL**: Docker Compose includes PostgreSQL setup

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- RabbitMQ (for local development)

### Local Development

1. **Install RabbitMQ** (if running locally):
   ```bash
   # Using Docker
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   ```

2. **Install dependencies for each service**:
   ```bash
   cd services/user-service && npm install
   cd ../product-service && npm install
   cd ../order-service && npm install
   cd ../payment-service && npm install
   ```

3. **Start services in development mode**:
   ```bash
   # Terminal 1 - User Service
   cd services/user-service && npm run dev

   # Terminal 2 - Product Service
   cd services/product-service && npm run dev

   # Terminal 3 - Order Service
   cd services/order-service && npm run dev

   # Terminal 4 - Payment Service
   cd services/payment-service && npm run dev
   ```

### Docker Deployment

1. **Build and start all services**:
   ```bash
   cd services
   docker-compose up --build
   ```

2. **Stop services**:
   ```bash
   docker-compose down
   ```

## API Endpoints

### User Service (localhost:3001)
```
POST /users/register        - Register new user
POST /users/login          - User login
GET  /users/:id            - Get user profile
PUT  /users/:id            - Update user profile
GET  /users                - Get all users (admin)
POST /users/validate-token - Validate JWT token
GET  /health               - Health check
```

### Product Service (localhost:3002)
```
GET    /products              - Get all products (with pagination, filtering)
GET    /products/:id          - Get product by ID
POST   /products              - Create new product (auth required)
PUT    /products/:id          - Update product (auth required)
DELETE /products/:id          - Delete product (auth required)
GET    /categories            - Get product categories
POST   /products/:id/inventory - Update inventory
POST   /products/check-availability - Check product availability
GET    /health                - Health check
```

### Order Service (localhost:3003)
```
POST /orders              - Create new order (auth required)
GET  /orders              - Get user's orders (auth required)
GET  /orders/:id          - Get order by ID (auth required)
PUT  /orders/:id/status   - Update order status (auth required)
POST /orders/:id/cancel   - Cancel order (auth required)
GET  /admin/orders        - Get all orders (admin)
GET  /health              - Health check
```

### Payment Service (localhost:3004)
```
POST /payments              - Initiate payment (auth required)
GET  /payments/:id          - Get payment status (auth required)
GET  /payments              - Get user's payments (auth required)
POST /payments/:id/refund   - Refund payment (auth required)
GET  /payment-methods       - Get supported payment methods
GET  /admin/payments        - Get all payments (admin)
GET  /health                - Health check
```

## Example Usage Flow

### 1. User Registration and Login
```bash
# Register user
curl -X POST http://localhost:3001/users/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3001/users/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Browse Products
```bash
# Get all products
curl http://localhost:3002/products

# Get product by ID
curl http://localhost:3002/products/{productId}
```

### 3. Create Order
```bash
# Create order (requires JWT token)
curl -X POST http://localhost:3003/orders \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {jwt_token}" \\
  -d '{
    "items": [
      {
        "productId": "{productId}",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "country": "USA"
    }
  }'
```

### 4. Process Payment
```bash
# Initiate payment (requires JWT token)
curl -X POST http://localhost:3004/payments \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {jwt_token}" \\
  -d '{
    "orderId": "{orderId}",
    "amount": 199.98,
    "currency": "USD",
    "paymentMethod": "credit_card"
  }'
```

## Event Flow

### Order Creation Flow
1. **User creates order** → Order Service
2. **Order Service checks availability** → Product Service (HTTP)
3. **Order Service reserves inventory** → Product Service (HTTP)
4. **Order Service publishes `order.created`** → RabbitMQ
5. **Order Service publishes `order.payment.required`** → RabbitMQ
6. **Payment Service receives payment required event**

### Payment Processing Flow
1. **User initiates payment** → Payment Service
2. **Payment Service publishes `payment.initiated`** → RabbitMQ
3. **Payment Service processes payment** (async)
4. **Payment Service publishes `payment.completed`** → RabbitMQ
5. **Order Service receives payment completed event**
6. **Order Service updates order status to confirmed**

## Environment Configuration

Each service uses environment variables for configuration:

```env
# Common variables
PORT=300X
RABBITMQ_URL=amqp://localhost:5672
NODE_ENV=development

# Database (optional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_db
DB_USERNAME=postgres
DB_PASSWORD=password

# Service URLs for HTTP communication
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004

# User Service specific
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
```

## RabbitMQ Management

- **Management UI**: http://localhost:15672
- **Default credentials**: admin / admin123
- **Exchanges**: user.exchange, product.exchange, order.exchange, payment.exchange
- **Queues**: Service-specific queues for event processing

## Monitoring and Health Checks

Each service provides a health check endpoint:
- User Service: http://localhost:3001/health
- Product Service: http://localhost:3002/health
- Order Service: http://localhost:3003/health
- Payment Service: http://localhost:3004/health

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS**: Cross-origin resource sharing configured
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Comprehensive error handling and logging

## Scalability Considerations

- **Horizontal Scaling**: Services can be scaled independently
- **Load Balancing**: Ready for load balancer integration
- **Database Separation**: Each service can have its own database
- **Caching**: Ready for Redis or similar caching solutions
- **Message Queues**: RabbitMQ ensures reliable message delivery

## Testing

To test the services:

1. **Start all services** (locally or with Docker)
2. **Run health checks** to ensure services are running
3. **Test authentication flow** (register → login → get token)
4. **Test business flow** (create order → process payment)
5. **Monitor RabbitMQ** for event flow verification

## Troubleshooting

### Common Issues

1. **RabbitMQ Connection Failed**:
   - Ensure RabbitMQ is running on port 5672
   - Check RABBITMQ_URL environment variable

2. **Service Authentication Failed**:
   - Verify JWT token is valid
   - Check User Service is running and accessible

3. **Database Connection Issues**:
   - Verify database credentials in .env files
   - Ensure PostgreSQL is running if using database

4. **Port Conflicts**:
   - Check if ports 3001-3004 are available
   - Modify PORT environment variables if needed

### Logs
Each service logs important events and errors to the console. Monitor the logs for debugging information.

## Future Enhancements

- **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
- **API Gateway**: Add Kong or similar API gateway
- **Service Mesh**: Implement Istio for advanced traffic management
- **Monitoring**: Add Prometheus and Grafana for metrics
- **Distributed Tracing**: Implement Jaeger for request tracing
- **CI/CD Pipeline**: Add automated testing and deployment
- **Security**: Add rate limiting, API keys, OAuth2
- **Documentation**: Add Swagger/OpenAPI documentation