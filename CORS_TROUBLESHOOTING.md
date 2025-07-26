# CORS Troubleshooting Guide

## Understanding CORS Errors

Cross-Origin Resource Sharing (CORS) errors occur when a web application attempts to request a resource from a different origin (domain, protocol, or port) than the one from which the application was served. This is a security feature implemented by browsers to prevent potentially malicious websites from accessing sensitive data.

## Common CORS Error Messages

1. **"Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy"**
2. **"No 'Access-Control-Allow-Origin' header is present on the requested resource"**
3. **"The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'"**
4. **"Request header field X is not allowed by Access-Control-Allow-Headers in preflight response"**

## Troubleshooting Steps

### 1. Check the API Gateway Logs

The SuperMall API Gateway logs detailed information about CORS errors:

- Look for messages starting with `❌ CORS rejected origin:` to see which origins are being rejected
- Check for detailed CORS error information with the prefix `🔴 CORS Error Details:`
- On startup, the API Gateway logs all configured origins with the prefix `🔒 CORS configured with the following origins:`

### 2. Verify Your Origin is Allowed

Ensure your frontend application's origin is included in one of the following:

- The `cors.origin` array in `api-gateway/config/config.js`
- The `CORS_ALLOWED_ORIGINS` environment variable
- The `FRONTEND_URL` environment variable

Remember that origins must match exactly, including the protocol (http/https) and port number.

### 3. Use the CORS Test Tools

- Access the `/cors-test` endpoint directly from your frontend application
- Use the included `cors-test.html` tool to test your configuration

### 4. Check for Common Issues

#### Incorrect Origin Format

Origins must include the protocol, domain, and port (if non-standard):

- Correct: `http://localhost:3000`
- Incorrect: `localhost:3000` or `http://localhost:3000/`

#### Missing Credentials Configuration

If you're using cookies or authentication headers:

- Frontend: Set `credentials: 'include'` in fetch options
- Backend: Ensure `credentials: true` is set in CORS options

#### Preflight Request Issues

For non-simple requests (like those with custom headers or methods other than GET/POST):

- Ensure the API Gateway correctly handles OPTIONS requests
- Check that all required headers are included in `allowedHeaders`

### 5. Environment-Specific Issues

#### Development

- When using different ports for frontend and backend, CORS is always required
- Ensure localhost with various ports is allowed

#### Production

- Verify that your production domain is explicitly allowed
- Check for protocol mismatches (http vs https)
- Ensure subdomains are handled correctly

## Advanced Solutions

### Dynamic CORS Configuration

For applications with changing origins:

```
# Add to .env file
CORS_ALLOWED_ORIGINS=https://app1.yourdomain.com,https://app2.yourdomain.com
```

### Using a Reverse Proxy

If CORS issues persist, consider using a reverse proxy (like Nginx) to serve both frontend and backend from the same origin.

## Testing Your Fix

After making changes to the CORS configuration:

1. Restart the API Gateway service
2. Clear your browser cache
3. Use the browser's developer tools to monitor network requests
4. Check for CORS errors in the console
5. Use the provided CORS test tools

## Still Having Issues?

If you've followed all the steps above and are still experiencing CORS issues:

1. Check if there are any intermediary services (like CDNs) that might be stripping CORS headers
2. Verify that your network/firewall isn't blocking or modifying the headers
3. Try testing with a different browser to rule out browser-specific issues