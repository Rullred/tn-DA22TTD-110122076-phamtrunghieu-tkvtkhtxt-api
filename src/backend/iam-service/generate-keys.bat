@echo off
REM Script to generate RSA key pair for JWT signing (Windows)
REM Requires OpenSSL (can be installed via Git for Windows or Chocolatey)

echo Generating RSA 2048-bit key pair for JWT...

REM Create keys directory if it doesn't exist
if not exist "src\main\resources\keys" mkdir "src\main\resources\keys"

REM Generate private key
openssl genrsa -out src\main\resources\keys\private_key.pem 2048

REM Generate public key from private key
openssl rsa -in src\main\resources\keys\private_key.pem -pubout -out src\main\resources\keys\public_key.pem

echo Keys generated successfully!
echo Private key: src\main\resources\keys\private_key.pem
echo Public key: src\main\resources\keys\public_key.pem
echo.
echo IMPORTANT: Add these files to .gitignore to keep them secure!
pause
