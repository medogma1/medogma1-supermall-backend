@echo off
echo Starting all services...

start cmd /k "cd api-gateway && npm start"
timeout /t 2
start cmd /k "cd auth-service && npm start"
timeout /t 2
start cmd /k "cd user-service && npm start"
timeout /t 2
start cmd /k "cd vendor-service && npm start"
timeout /t 2
start cmd /k "cd product-service && npm start"
timeout /t 2
start cmd /k "cd order-service && npm start"
timeout /t 2
start cmd /k "cd support-service && npm start"
timeout /t 2
start cmd /k "cd chat-service && npm start"
timeout /t 2
start cmd /k "cd notification-service && npm start"
timeout /t 2
start cmd /k "cd analytics-service && npm start"
timeout /t 2
start cmd /k "cd upload-service && npm start"

echo All services started!