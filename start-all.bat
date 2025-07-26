@echo off
echo Starting Super Mall Backend Services...
echo.

REM Start API Gateway
echo Starting API Gateway...
start "API Gateway" cmd /k "cd api-gateway && npm start"
timeout /t 2 /nobreak >nul

REM Start Auth Service
echo Starting Auth Service...
start "Auth Service" cmd /k "cd auth-service && npm start"
timeout /t 2 /nobreak >nul

REM Start User Service
echo Starting User Service...
start "User Service" cmd /k "cd user-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Product Service
echo Starting Product Service...
start "Product Service" cmd /k "cd product-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Order Service
echo Starting Order Service...
start "Order Service" cmd /k "cd order-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Vendor Service
echo Starting Vendor Service...
start "Vendor Service" cmd /k "cd vendor-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Support Service
echo Starting Support Service...
start "Support Service" cmd /k "cd support-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Chat Service
echo Starting Chat Service...
start "Chat Service" cmd /k "cd chat-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Notification Service
echo Starting Notification Service...
start "Notification Service" cmd /k "cd notification-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Upload Service
echo Starting Upload Service...
start "Upload Service" cmd /k "cd upload-service && npm start"
timeout /t 2 /nobreak >nul

REM Start Analytics Service
echo Starting Analytics Service...
start "Analytics Service" cmd /k "cd analytics-service && npm start"
timeout /t 2 /nobreak >nul

echo.
echo All services are starting...
echo Check individual windows for service status.
echo.
pause