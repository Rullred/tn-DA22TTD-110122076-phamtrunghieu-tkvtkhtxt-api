@echo off
echo ========================================
echo    SETUP TOTP CHO ADMIN
echo ========================================
echo.

echo [Buoc 1] Dang nhap voi tai khoan admin...
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"phamtrunghieudhi1301@gmail.com\",\"password\":\"admin123\"}" -o login-response.json
echo.
echo.

echo ========================================
echo Token da duoc luu vao file: login-response.json
echo Hay copy accessToken tu file nay!
echo ========================================
echo.

set /p token="Dan ACCESS_TOKEN vao day va nhan Enter: "
echo.

echo [Buoc 2] Lay QR Code TOTP...
curl -X POST http://localhost:8080/api/auth/totp/setup -H "Authorization: Bearer %token%" -o totp-qr.json
echo.
echo.

echo ========================================
echo QR Code da duoc luu vao file: totp-qr.json
echo ========================================
echo.
echo Hay mo file totp-qr.json va:
echo 1. Copy gia tri "qrCodeDataUrl"
echo 2. Dan vao trinh duyet de xem QR code
echo 3. Hoac copy "manualEntryKey" de nhap thu cong
echo.
echo ========================================
echo.

set /p code="Sau khi quet QR bang Google Authenticator, nhap ma 6 so vao day: "
echo.

echo [Buoc 3] Kich hoat TOTP...
curl -X POST http://localhost:8080/api/auth/totp/enable -H "Authorization: Bearer %token%" -H "Content-Type: application/json" -d "{\"code\":\"%code%\"}"
echo.
echo.

echo ========================================
echo HOAN THANH!
echo ========================================
echo.
echo Hay thu dang nhap lai de kiem tra:
echo.
echo [Buoc 4] Dang nhap lai...
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"phamtrunghieudhi1301@gmail.com\",\"password\":\"admin123\"}"
echo.
echo.

echo Ban se thay thong bao: "Vui long nhap ma TOTP tu Google Authenticator"
echo.

set /p code2="Nhap ma TOTP moi tu Google Authenticator: "
echo.

echo [Buoc 5] Xac minh TOTP...
curl -X POST http://localhost:8080/api/auth/totp/verify -H "Content-Type: application/json" -d "{\"email\":\"phamtrunghieudhi1301@gmail.com\",\"code\":\"%code2%\"}"
echo.
echo.

echo ========================================
echo THANH CONG! TOTP da duoc kich hoat!
echo ========================================
echo.

pause
