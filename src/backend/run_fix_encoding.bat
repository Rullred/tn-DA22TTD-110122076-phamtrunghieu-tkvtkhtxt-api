@echo off
chcp 65001 >nul
REM ============================================
REM SCRIPT TỰ ĐỘNG SỬA LỖI ENCODING TIẾNG VIỆT
REM ============================================

echo.
echo ========================================
echo  SỬA LỖI ENCODING TIẾNG VIỆT
echo  Database: student_management_db
echo ========================================
echo.

REM Chuyển đến thư mục backend
cd /d "%~dp0"

echo [1/4] Kiểm tra encoding hiện tại của database...
echo.
psql -U app_user -d student_management_db -h localhost -p 5432 -c "SELECT datname, pg_encoding_to_char(encoding) AS encoding FROM pg_database WHERE datname = 'student_management_db';"

echo.
echo [2/4] Hiển thị dữ liệu cũ (bị lỗi encoding)...
echo.
psql -U app_user -d student_management_db -h localhost -p 5432 -c "SELECT ma_lop, ten_lop FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH' ORDER BY ma_lop LIMIT 5;"

echo.
echo [3/4] Chạy script sửa lỗi encoding...
echo.
psql -U app_user -d student_management_db -h localhost -p 5432 -f FIX_ENCODING_POSTGRESQL.sql

echo.
echo [4/4] Kiểm tra kết quả (phải hiển thị đúng tiếng Việt)...
echo.
psql -U app_user -d student_management_db -h localhost -p 5432 -c "SELECT ma_lop, ten_lop, loai_lop FROM lop_hoc WHERE loai_lop = 'LOP_HANH_CHINH' ORDER BY ma_lop;"

echo.
echo ========================================
echo  HOÀN THÀNH!
echo ========================================
echo.
echo Nếu kết quả hiển thị đúng tiếng Việt:
echo  - Restart backend service
echo  - Clear browser cache (Ctrl+Shift+R)
echo  - Test lại trên frontend
echo.
echo Nếu vẫn bị lỗi, xem file:
echo  HUONG_DAN_SUA_LOI_ENCODING.md
echo.

pause
