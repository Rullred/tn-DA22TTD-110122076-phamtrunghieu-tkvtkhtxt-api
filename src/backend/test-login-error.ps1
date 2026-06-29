# Test login with wrong password
$body = @{
    usernameOrEmail = "hieupham"
    password = "WrongPassword123"
} | ConvertTo-Json

Write-Host "Testing login with WRONG password..." -ForegroundColor Yellow
Write-Host "Request body: $body" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host "SUCCESS (This should not happen!)" -ForegroundColor Red
    $response | ConvertTo-Json
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDescription = $_.Exception.Response.StatusDescription
    
    Write-Host "`nStatus Code: $statusCode" -ForegroundColor Green
    Write-Host "Status Description: $statusDescription" -ForegroundColor Green
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Response Body:" -ForegroundColor Yellow
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorBody | ConvertTo-Json -Depth 5
    } else {
        Write-Host "`nNo error details in response body" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Now testing login with CORRECT password..." -ForegroundColor Yellow

$body2 = @{
    usernameOrEmail = "hieupham"
    password = "Hieu@123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $body2 -ContentType 'application/json' -ErrorAction Stop
    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Access Token: $($response.data.accessToken.Substring(0, 50))..." -ForegroundColor Cyan
} catch {
    Write-Host "`nFAILED (This should not happen!)" -ForegroundColor Red
    $_.Exception.Message
}
