# Test API Script
$uri = "http://localhost:8081/api/auth/login"
$body = @{
    usernameOrEmail = "hieupham"
    password = "SaiMatKhau123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body
    Write-Host "Success:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error Response:" -ForegroundColor Yellow
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}
