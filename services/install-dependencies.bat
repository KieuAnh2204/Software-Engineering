@echo off
echo ====================================
echo  Microservices Local Setup
echo ====================================

echo.
echo Installing dependencies for all services...
echo.

echo Installing User Service dependencies...
cd user-service
call npm install --force
cd ..

echo Installing Product Service dependencies...
cd product-service  
call npm install --force
cd ..

echo Installing Order Service dependencies...
cd order-service
call npm install --force
cd ..

echo Installing Payment Service dependencies...
cd payment-service
call npm install --force
cd ..

echo.
echo ====================================
echo  All dependencies installed!
echo ====================================
echo.
echo Note: If you see peer dependency warnings, they are usually safe to ignore.
echo.
echo To start the services, first ensure you have MongoDB running:
echo - Install MongoDB locally OR
echo - Run: docker run -d --name mongodb -p 27017:27017 mongo:6
echo.
echo Then start services in separate terminals:
echo Terminal 1: cd user-service && npm run dev
echo Terminal 2: cd product-service && npm run dev  
echo Terminal 3: cd order-service && npm run dev
echo Terminal 4: cd payment-service && npm run dev
echo.
echo Or use start-services.bat to start all at once
echo.
pause