# Local Development Setup

Since Docker Desktop isn't available, let's run the services locally. Follow these steps:

## Prerequisites
- Node.js 18+ installed
- RabbitMQ installed locally OR use CloudAMQP (cloud RabbitMQ)

## Option 1: Install RabbitMQ Locally

### Windows Installation:
1. Download and install Erlang: https://www.erlang.org/downloads
2. Download and install RabbitMQ: https://www.rabbitmq.com/install-windows.html
3. Enable RabbitMQ Management Plugin:
   ```cmd
   rabbitmq-plugins enable rabbitmq_management
   ```
4. Start RabbitMQ service:
   ```cmd
   rabbitmq-server
   ```
5. Access management UI: http://localhost:15672 (guest/guest)

## Option 2: Use CloudAMQP (Recommended for quick start)

1. Go to https://www.cloudamqp.com/
2. Create a free account
3. Create a new instance (free tier available)
4. Copy the AMQP URL provided
5. Update the .env files with your CloudAMQP URL

## Running the Services Locally

### Step 1: Install Dependencies
```bash
# User Service
cd user-service
npm install
cd ..

# Product Service
cd product-service
npm install
cd ..

# Order Service
cd order-service
npm install
cd ..

# Payment Service
cd payment-service
npm install
cd ..
```

### Step 2: Start Services (in separate terminals)

```bash
# Terminal 1 - User Service
cd user-service
npm run dev

# Terminal 2 - Product Service
cd product-service
npm run dev

# Terminal 3 - Order Service
cd order-service
npm run dev

# Terminal 4 - Payment Service
cd payment-service
npm run dev
```

## Testing the Services

Once all services are running, you can test them:

1. **Health Checks**:
   - User Service: http://localhost:3001/health
   - Product Service: http://localhost:3002/health
   - Order Service: http://localhost:3003/health
   - Payment Service: http://localhost:3004/health

2. **Register a User**:
   ```bash
   curl -X POST http://localhost:3001/users/register -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:3001/users/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
   ```

4. **View Products**:
   ```bash
   curl http://localhost:3002/products
   ```

## Alternative: Use Online RabbitMQ

If you prefer not to install RabbitMQ locally, you can use a cloud service. I'll update the .env files to use CloudAMQP.