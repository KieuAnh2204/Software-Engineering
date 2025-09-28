@echo off
echo ====================================
echo  Starting All Microservices
echo ====================================

echo.
echo Note: Make sure you have MongoDB and RabbitMQ running!
echo.
echo Starting MongoDB (if not running):
docker run -d --name mongodb -p 27017:27017 mongo:6
echo.
echo Starting RabbitMQ (if not running):
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
echo.

echo Starting services...
echo.

start "User Service" cmd /k "cd user-service && npm run start:dev"
timeout /t 3 /nobreak > nul

start "Product Service" cmd /k "cd product-service && npm run start:dev"  
timeout /t 3 /nobreak > nul

start "Order Service" cmd /k "cd order-service && npm run start:dev"
timeout /t 3 /nobreak > nul

start "Payment Service" cmd /k "cd payment-service && npm run start:dev"

echo.
echo ====================================
echo  All services are starting...
echo ====================================
echo.
echo Services will be available at:
echo - User Service: http://localhost:3001
echo - Product Service: http://localhost:3002  
echo - Order Service: http://localhost:3003
echo - Payment Service: http://localhost:3004
echo - RabbitMQ Management: http://localhost:15672 (guest/guest)
echo - MongoDB: mongodb://localhost:27017
echo.
echo Press any key to close this window...
pause