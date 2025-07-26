# Test admin users endpoint
$loginData = @{
    email = "admin@supermall.com"
    password = "xx100100"
} | ConvertTo-Json

# Login to get token
Write-Host "Logging in..."
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login response: $($loginResponse | ConvertTo-Json)"
    $token = $loginResponse.data.token
    if (-not $token) {
        Write-Host "No token received in response"
        exit 1
    }
    Write-Host "Login successful!"
    Write-Host "Token obtained: $($token.Substring(0,20))..."
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
    exit 1
}

# Test admin users endpoint
Write-Host "Testing admin users endpoint..."
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:5001/admin/users" -Method GET -Headers $headers
    Write-Host "Success! Users count: $($usersResponse.results)"
    Write-Host "Response: $($usersResponse | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}