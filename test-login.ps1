$headers = @{'Content-Type' = 'application/json'}
$body = '{"email":"admin@supermall.com","password":"xx100100"}'

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/auth/login' -Method POST -Headers $headers -Body $body
    Write-Host 'Success:' $response.success
    Write-Host 'Token:' $response.data.token
    
    # Now test the admin endpoint with the token
    $authHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $($response.data.token)"
    }
    
    Write-Host 'Testing /admin/stores endpoint...'
    Write-Host 'Using token:' $response.data.token
    Write-Host 'Auth header:' $authHeaders.Authorization
    
    # Test vendor service directly first
    Write-Host 'Testing vendor service directly...'
    try {
        $vendorResponse = Invoke-RestMethod -Uri 'http://localhost:5005/api/v1/vendors' -Method GET -Headers $authHeaders
        Write-Host 'Direct vendor response:' ($vendorResponse | ConvertTo-Json)
    } catch {
        Write-Host 'Direct vendor error:' $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host 'Direct vendor response body:' $responseBody
        }
    }
    
    # Now test through API Gateway
    Write-Host 'Testing through API Gateway...'
    try {
        $storesResponse = Invoke-RestMethod -Uri 'http://localhost:5001/admin/stores' -Method GET -Headers $authHeaders
        Write-Host 'Gateway stores response:' ($storesResponse | ConvertTo-Json)
    } catch {
        Write-Host 'Gateway admin endpoint error:' $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host 'Gateway admin response body:' $responseBody
        }
    }
    
} catch {
    Write-Host 'Error:' $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host 'Response body:' $responseBody
    }
}