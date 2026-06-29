@echo off
echo ========================================
echo Restart System - Student Management
echo ========================================
echo.
echo Dang tat tat ca services...
docker-compose down

echo.
echo Dang khoi dong lai...
docker-compose up -d

echo.
echo Dang doi services khoi dong (35 giay)...
timeout /t 35 /nobreak

echo.
echo Kiem tra trang thai:
docker-compose ps

echo.
echo ========================================
echo Hoan thanh!
echo ========================================
echo.
echo Swagger UI:
echo - IAM Service: http://localhost:8081/swagger-ui/index.html
echo - HR Service:  http://localhost:8082/swagger-ui/index.html
echo.
pause
