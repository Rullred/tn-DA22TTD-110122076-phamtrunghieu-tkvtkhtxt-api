# QR Login Test Script
# This script demonstrates the complete QR login flow

Write-Host "=== QR LOGIN TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate QR Code
Write-Host "Step 1: Generating QR Code..." -ForegroundColor Yellow
$body = @{
    usernameOrEmail = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $qrResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/qr-login" -Method POST -Body $body -ContentType "application/json"
    
    if ($qrResponse.success) {
        $loginToken = $qrResponse.data.loginToken
        $confirmLink = $qrResponse.data.confirmationLink
        $expiresIn = $qrResponse.data.expiresIn
        
        Write-Host "✅ QR Code generated successfully!" -ForegroundColor Green
        Write-Host "   Login Token: $loginToken" -ForegroundColor Gray
        Write-Host "   Expires in: $expiresIn seconds" -ForegroundColor Gray
        Write-Host "   Confirmation Link: $confirmLink" -ForegroundColor Gray
        Write-Host ""
        
        # Save QR code to file
        $qrDataUrl = $qrResponse.data.qrCodeDataUrl
        $base64Data = $qrDataUrl.Replace("data:image/png;base64,", "")
        $bytes = [Convert]::FromBase64String($base64Data)
        [IO.File]::WriteAllBytes("qr-code.png", $bytes)
        Write-Host "   QR Code saved to: qr-code.png" -ForegroundColor Gray
        Write-Host ""
        
        # Step 2: Check status (PENDING)
        Write-Host "Step 2: Checking initial status..." -ForegroundColor Yellow
        $statusResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/qr-status?token=$loginToken" -Method GET
        Write-Host "   Status: $($statusResponse.data.status)" -ForegroundColor Cyan
        Write-Host ""
        
        # Step 3: User action
        Write-Host "Step 3: Waiting for user to scan QR code..." -ForegroundColor Yellow
        Write-Host "   ACTION REQUIRED: Please scan the QR code (qr-code.png) with your phone" -ForegroundColor Magenta
        Write-Host "   Or visit this link on your phone: $confirmLink" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "   Press ENTER to simulate QR confirmation..." -ForegroundColor Yellow
        Read-Host
        
        # Simulate QR confirmation
        Write-Host "   Simulating QR confirmation..." -ForegroundColor Gray
        $confirmResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/qr-confirm?token=$loginToken" -Method GET -UseBasicParsing
        if ($confirmResponse.StatusCode -eq 200) {
            Write-Host "   ✅ QR confirmed on phone!" -ForegroundColor Green
        }
        Write-Host ""
        
        # Step 4: Check status (CONFIRMED) and get tokens
        Write-Host "Step 4: Checking status after confirmation..." -ForegroundColor Yellow
        $finalResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/qr-status?token=$loginToken" -Method GET
        
        if ($finalResponse.data.status -eq "CONFIRMED") {
            Write-Host "   ✅ Status: CONFIRMED" -ForegroundColor Green
            Write-Host "   ✅ Access Token: $($finalResponse.data.accessToken.Substring(0, 50))..." -ForegroundColor Green
            Write-Host "   ✅ Refresh Token: $($finalResponse.data.refreshToken)" -ForegroundColor Green
            Write-Host "   ✅ User: $($finalResponse.data.user.username) <$($finalResponse.data.user.email)>" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 QR Login successful! User is now authenticated." -ForegroundColor Green
        } else {
            Write-Host "   ❌ Status: $($finalResponse.data.status)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Failed to generate QR code" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
