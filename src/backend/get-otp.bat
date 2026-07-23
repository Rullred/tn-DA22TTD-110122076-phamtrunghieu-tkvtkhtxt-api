@echo off
echo ========================================
echo LAY MA OTP TU LOGS
echo ========================================
echo.
docker logs iam-service --tail 100 | findstr /C:"Generated OTP"
echo.
echo ========================================
echo Ma OTP nam o dong tren (6 chu so)
echo ========================================
pause
