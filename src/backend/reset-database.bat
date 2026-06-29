@echo off
echo ========================================
echo Reset Database - Student Management System
echo ========================================
echo.
echo Canh bao: Lenh nay se xoa TOAN BO du lieu trong database!
echo.
set /p confirm="Ban co chac chan muon tiep tuc? (Y/N): "

if /i "%confirm%" NEQ "Y" (
    echo Da huy!
    exit /b
)

echo.
echo Dang xoa toan bo users...
docker exec -it postgres psql -U app_user -d student_management_db -c "DELETE FROM nguoi_dung;"

echo.
echo Da xoa thanh cong!
echo.
echo Ban co the dang ky lai voi bat ky username nao.
echo.
pause
