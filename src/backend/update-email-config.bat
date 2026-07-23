@echo off
echo ========================================
echo CAP NHAT CAU HINH EMAIL OTP
echo ========================================
echo.
echo Tai khoan Gmail: phamtrunghieudhi1301@gmail.com
echo.
echo HUONG DAN:
echo 1. Tao App Password tai: https://myaccount.google.com/apppasswords
echo 2. Copy App Password (16 ky tu, bo khoang trang)
echo 3. Mo file .env bang Notepad
echo 4. Tim dong: MAIL_PASSWORD=YOUR_16_CHARACTER_APP_PASSWORD_HERE
echo 5. Thay the bang App Password cua ban
echo 6. Luu file (Ctrl + S)
echo 7. Chay lai script nay de restart service
echo.

set /p ready="Ban da cap nhat file .env chua? (y/n): "

if /i "%ready%" neq "y" (
    echo.
    echo Hay cap nhat file .env truoc, sau do chay lai script nay.
    echo File can sua: a:\DATN\backend\.env
    pause
    exit /b
)

echo.
echo Dang restart IAM Service...
docker-compose restart iam-service

echo.
echo Cho 10 giay de service khoi dong...
timeout /t 10 /nobreak > nul

echo.
echo Kiem tra logs:
docker logs iam-service --tail 20

echo.
echo ========================================
echo HOAN THANH!
echo ========================================
echo.
echo Test lai chuc nang:
echo 1. Vao: http://localhost:5173
echo 2. Dang nhap: phamtrunghieudhi1301@gmail.com / admin123
echo 3. Kiem tra email de nhan ma OTP
echo.
pause
